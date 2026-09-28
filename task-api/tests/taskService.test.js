const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    it('creates a task with required fields', () => {
      const task = taskService.create({ title: 'My task' });
      expect(task.id).toBeDefined();
      expect(task.title).toBe('My task');
      expect(task.status).toBe('todo');
    });

    it('accepts full input', () => {
      const task = taskService.create({
        title: 'Full task',
        description: 'desc',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2025-01-01T10:00:00.000Z'
      });
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
    });
  });

  describe('getAll', () => {
    it('returns empty array initially', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    it('lists all created tasks', () => {
      taskService.create({ title: 'A' });
      taskService.create({ title: 'B' });
      expect(taskService.getAll().length).toBe(2);
    });
  });

  describe('findById', () => {
    it('finds an existing task', () => {
      const task = taskService.create({ title: 'X' });
      expect(taskService.findById(task.id)).toEqual(task);
    });

    it('returns undefined for unknown id', () => {
      expect(taskService.findById('unknown')).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('filters by status exactly', () => {
      taskService.create({ title: 'A', status: 'todo' });
      taskService.create({ title: 'B', status: 'done' });
      expect(taskService.getByStatus('todo').length).toBe(1);
    });

    it('does not match substrings', () => {
      taskService.create({ title: 'A', status: 'in_progress' });
      expect(taskService.getByStatus('in').length).toBe(0);
    });
  });

  describe('getPaginated', () => {
    it('returns the first page starting at index 0', () => {
      taskService.create({ title: 'A' });
      taskService.create({ title: 'B' });
      taskService.create({ title: 'C' });
      const firstPage = taskService.getPaginated(1, 2);
      expect(firstPage.length).toBe(2);
      expect(firstPage[0].title).toBe('A');
      expect(firstPage[1].title).toBe('B');
    });

    it('returns the second page correctly', () => {
      for (let i = 0; i < 5; i++) {
        taskService.create({ title: `T${i}` });
      }
      const secondPage = taskService.getPaginated(2, 2);
      expect(secondPage.length).toBe(2);
      expect(secondPage[0].title).toBe('T2');
      expect(secondPage[1].title).toBe('T3');
    });
  });

  describe('update', () => {
    it('updates fields', () => {
      const task = taskService.create({ title: 'X' });
      const updated = taskService.update(task.id, { title: 'Y', priority: 'low' });
      expect(updated.title).toBe('Y');
      expect(updated.priority).toBe('low');
    });

    it('returns null when not found', () => {
      expect(taskService.update('unknown', { title: 'Y' })).toBeNull();
    });

    it('does not modify immutable fields (id, createdAt)', () => {
      const task = taskService.create({ title: 'X' });
      const updated = taskService.update(task.id, { id: 'hacked', createdAt: '2020-01-01T00:00:00.000Z' });
      expect(updated.id).toBe(task.id);
      expect(updated.createdAt).toBe(task.createdAt);
    });

    it('ignores fields outside the allowed update set', () => {
      const task = taskService.create({ title: 'X' });
      const updated = taskService.update(task.id, { assignee: 'someone' });
      expect(updated.assignee).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('removes existing task', () => {
      const task = taskService.create({ title: 'X' });
      expect(taskService.remove(task.id)).toBe(true);
      expect(taskService.getAll().length).toBe(0);
    });

    it('returns false for unknown id', () => {
      expect(taskService.remove('unknown')).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('marks task as done', () => {
      const task = taskService.create({ title: 'X', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
      expect(completed.priority).toBe('medium'); // forced by current code
    });

    it('returns null for unknown id', () => {
      expect(taskService.completeTask('unknown')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('counts correctly and calculates overdue', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      taskService.create({ title: 'A', status: 'todo', dueDate: past.toISOString() });
      taskService.create({ title: 'B', status: 'done', dueDate: past.toISOString() });
      const stats = taskService.getStats();
      expect(stats.todo).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('assignTask', () => {
    it('assigns a task to a user', () => {
      const task = taskService.create({ title: 'X' });
      const assigned = taskService.assignTask(task.id, 'Alice');
      expect(assigned.assignee).toBe('Alice');
    });

    it('returns null for unknown id', () => {
      expect(taskService.assignTask('unknown', 'Alice')).toBeNull();
    });

    it('allows reassigning', () => {
      const task = taskService.create({ title: 'X' });
      taskService.assignTask(task.id, 'Alice');
      const reassigned = taskService.assignTask(task.id, 'Bob');
      expect(reassigned.assignee).toBe('Bob');
    });
  });
});
