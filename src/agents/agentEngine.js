const config = require('../config/config');
const { getSystemPrompt } = require('./prompts');
const { customerToolSchemas, executeCustomerTool } = require('./tools/customerTools');
const { retailerToolSchemas, executeRetailerTool } = require('./tools/retailerTools');

async function runAgent({ mode = 'customer', messages = [] }) {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env file.');
  }

  const systemPrompt = getSystemPrompt(mode);
  const tools = mode === 'customer' ? customerToolSchemas : retailerToolSchemas;
  const executeTool = mode === 'customer' ? executeCustomerTool : executeRetailerTool;

  const conversation = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const actionsTaken = [];
  let currentMessages = [...conversation];

  // Agentic tool execution loop (up to 3 hops)
  for (let step = 0; step < 3; step++) {
    const payload = {
      model: config.groqModel,
      messages: currentMessages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 1024
    };

    const res = await fetch(config.groqApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices && data.choices[0];
    if (!choice) {
      throw new Error('No choice returned from Groq model.');
    }

    const msg = choice.message;

    // If agent decides to call tools
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      currentMessages.push(msg);

      for (const call of msg.tool_calls) {
        const fnName = call.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(call.function.arguments || '{}');
        } catch (e) {
          fnArgs = {};
        }

        let toolResult;
        let errorOccurred = false;
        try {
          toolResult = executeTool(fnName, fnArgs);
        } catch (err) {
          toolResult = { error: err.message };
          errorOccurred = true;
        }

        actionsTaken.push({
          tool: fnName,
          arguments: fnArgs,
          result: toolResult,
          status: errorOccurred ? 'error' : 'success'
        });

        currentMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResult)
        });
      }
      continue;
    }

    // Final response reached with no more tool calls
    return {
      reply: msg.content || 'Action completed successfully.',
      actionsTaken
    };
  }

  // Final synthesis pass if tools were executed
  if (actionsTaken.length > 0) {
    try {
      const finalRes = await fetch(config.groqApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.groqModel,
          messages: currentMessages,
          temperature: 0.2,
          max_tokens: 1024
        })
      });
      if (finalRes.ok) {
        const finalData = await finalRes.json();
        const finalMsg = finalData.choices && finalData.choices[0] && finalData.choices[0].message;
        if (finalMsg && finalMsg.content) {
          return {
            reply: finalMsg.content,
            actionsTaken
          };
        }
      }
    } catch (e) {
      console.warn('Final synthesis error:', e);
    }
  }

  return {
    reply: 'Completed requested actions.',
    actionsTaken
  };
}

module.exports = {
  runAgent
};
