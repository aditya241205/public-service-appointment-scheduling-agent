const { runAgent } = require('../agents/agentEngine');

exports.chatWithAgent = async (req, res) => {
  try {
    const { mode = 'customer', messages = [] } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required.' });
    }

    const response = await runAgent({ mode, messages });
    res.json({ success: true, ...response });
  } catch (err) {
    console.error('Agent execution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
