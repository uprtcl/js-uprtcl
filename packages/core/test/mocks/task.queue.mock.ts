import { Task } from '../../src/utils/task.queue';

export class TaskQueueMock {
  public queueTask(task: Task): void {
    setTimeout(() => task.task(), 100);
  }
}
