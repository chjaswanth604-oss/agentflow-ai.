const env = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let queue = null;
let useRedisQueue = false;

let hasLoggedWarning = false;

try {
  const { Queue, Worker } = require('bullmq');
  const Redis = require('ioredis');

  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 1000,
    enableOfflineQueue: false,
    retryStrategy: () => null // Stop retrying if Redis is not running locally
  });

  connection.on('error', (err) => {
    if (!hasLoggedWarning) {
      console.warn(`[BullMQ Queue] Local Redis server not detected. Using In-Memory Queue fallback.`);
      hasLoggedWarning = true;
    }
    useRedisQueue = false;
  });

  queue = new Queue('workflow-executions', { connection });

  const worker = new Worker(
    'workflow-executions',
    async (job) => {
      console.log(`[BullMQ Worker] Processing execution job ${job.data.executionId}`);
      await orchestrator.runExecution(job.data.executionId);
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed: ${err.message}`);
  });

  useRedisQueue = true;
  console.log('[BullMQ Queue] Initialized with Redis connection.');
} catch (err) {
  if (!hasLoggedWarning) {
    console.warn(`[BullMQ Queue] Could not initialize Redis Queue (${err.message}). Defaulting to In-Memory Queue.`);
    hasLoggedWarning = true;
  }
  useRedisQueue = false;
}

/**
 * Enqueue an execution job
 */
const addExecutionJob = async (executionId) => {
  if (useRedisQueue && queue) {
    try {
      await queue.add('execute', { executionId });
      return { status: 'queued', mode: 'redis' };
    } catch (err) {
      console.warn(`[Queue] Redis add failed (${err.message}). Running in-memory async execution.`);
    }
  }

  // In-Memory Async Fallback Execution
  setImmediate(async () => {
    try {
      await orchestrator.runExecution(executionId);
    } catch (err) {
      console.error(`[In-Memory Queue] Execution ${executionId} error:`, err);
    }
  });

  return { status: 'queued', mode: 'in-memory' };
};

module.exports = { addExecutionJob };
