import { Logger } from '@uprtcl/micro-orchestrator';

import { installOfflineWatcher } from './offline.watcher';
import { injectable } from 'inversify';

type Dictionary<T> = { [key: string]: T };

export interface Task {
  id: string;
  task: () => Promise<any>;
  dependsOn?: string;
}

@injectable()
export class TaskQueue {
  logger = new Logger(this.constructor.name);

  // Configurations
  interval: any = null;
  retryInterval: number; // Milliseconds

  // Tasks
  queue: Dictionary<Task> = {};
  finishedTasks: Dictionary<boolean> = {};
  dependenciesQueue: Dictionary<Task> = {};

  // Listeners
  pendingListeners: Array<() => any> = [];
  finishedListeners: Array<() => any> = [];

  // Auxiliar properties
  tasksPending: boolean = false;
  pendingResolve: (() => void) | undefined = undefined;
  pendingPromise: Promise<void> | undefined = undefined;
  offline: boolean = false;

  // Pass retryInterval = 0 to disable retrying
  constructor() {
    this.retryInterval = 100;

    installOfflineWatcher(offline => {
      this.offline = offline;
    });
  }

  /**
   * Callback that is executed whenever there are pending tasks
   */
  public onTasksPending(callback: () => any): void {
    this.pendingListeners.push(callback);
  }

  /**
   * Callback that is executed whenever all pending tasks are finished
   */
  public onTasksFinished(callback: () => any): void {
    this.finishedListeners.push(callback);
  }

  /**
   * Returns a promise that finished when all pending tasks are finished
   * Usage: await waitForAllTasks()
   */
  public waitForAllTasks(): Promise<void> {
    return this.tasksPending && this.pendingPromise ? this.pendingPromise : Promise.resolve();
  }

  /**
   * Runs the task immediately if we are online, queue it if we are offline
   * @param task
   */
  public queueTask(task: Task): void {
    if (!task.id) {
      task.id = Math.random().toString();
    }

    this.finishedTasks[task.id] = false;

    if (!this.offline) {
      // Remove the task with the same id from the queue, if it existed
      delete this.queue[task.id];

      this.logger.log('Received task: we are online, run task', task);
      this.runTaskIfAble(task);
    } else {
      this.logger.log('Received task: we are offline, queue task', task, this.queue);
      this.queue[task.id] = task;
      this.scheduleTasksRun();
    }
  }

  /**
   * Schedule tasks to be run at the next interval
   */
  private scheduleTasksRun(): void {
    if (this.interval == null) {
      this.interval = setInterval(() => this.runTasks(), this.retryInterval);
    }
  }

  /**
   * Run all tasks in the queue, if online
   */
  private runTasks(): void {
    if (!this.offline) {
      this.logger.log('Running scheduled tasks', this.queue);
      // Clear queue
      const queue = this.queue;
      this.queue = {};

      // Clear interval
      clearInterval(this.interval);
      this.interval = null;

      for (const taskId of Object.keys(queue)) {
        this.runTaskIfAble(queue[taskId]);
      }
    }
  }

  /**
   * Runs the task if it didn't depend on any unfinished task
   * @param task
   */
  private runTaskIfAble(task: Task): void {
    if (task.dependsOn && this.finishedTasks[task.dependsOn] === false) {
      // We cannot execute this task yet as it depends on another unfinished task
      this.logger.log('Scheduling task for later');
      this.dependenciesQueue[task.id] = task;
    } else {
      if (!this.tasksPending) {
        // Setup pending promise
        this.tasksPending = true;
        this.pendingPromise = new Promise(resolve => (this.pendingResolve = resolve));

        // Execute pending listeners
        this.pendingListeners.map(f => f());
      }

      // Run the task
      this.runTask(task);
    }
  }

  /**
   * Runs the given task, retrying if it fails, retry is enabled and we are online
   * @param task the task to execute
   */
  private async runTask(task: Task): Promise<void> {
    try {
      // Try to execute task
      await task.task();

      // Task finished
      this.finishedTasks[task.id] = true;

      // Execute pending tasks that were depending on the finished one
      const dependantTasksIds = Object.keys(this.dependenciesQueue).filter(
        dependantTaskId => this.dependenciesQueue[dependantTaskId].dependsOn === task.id
      );
      const dependantTasks: Dictionary<Task> = {};
      for (const taskId of dependantTasksIds) {
        dependantTasks[taskId] = this.dependenciesQueue[taskId];
        delete this.dependenciesQueue[taskId];
      }

      this.queue = { ...this.queue, ...dependantTasks };

      if (Object.keys(this.queue).length > 0) {
        this.scheduleTasksRun();
      }
    } catch (e) {
      if (this.retryInterval > 0 && this.offline) {
        this.logger.warn('Task ', task, ' failed with error', e, ' retrying when online');

        // If there is a new task with the same id, don't retry this one since it has been overriden
        if (this.queue[task.id] && this.queue[task.id] !== task) {
          return;
        }

        // Add task to queue and schedule run
        this.queue[task.id] = task;

        this.scheduleTasksRun();
      } else {
        this.logger.error('Task ', task, ' failed with error', e, ' not retrying');

        // Task failed, delete the task from the dictionary
        this.finishedTasks[task.id] = true;
        delete this.queue[task.id];
      }
    }

    // Execute tasks finished listeners if all tasks are finished
    if (Object.keys(this.finishedTasks).every(key => this.finishedTasks[key])) {
      this.tasksPending = false;
      if (this.pendingResolve) this.pendingResolve();

      this.finishedListeners.map(f => f());
    }
  }
}
