const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true }, // e.g. 'trigger', 'action', 'ai_prompt', 'gmail', 'slack', 'discord', 'sheets'
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  data: {
    label: { type: String, required: true },
    provider: { type: String },
    action: { type: String },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }
  }
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  label: { type: String },
  animated: { type: Boolean, default: true }
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },
  triggerConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: { type: 'manual', schedule: '' }
  },
  nodes: [nodeSchema],
  edges: [edgeSchema],
  version: {
    type: Number,
    default: 1
  },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Workflow', workflowSchema);
