const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    it('returns empty array when no tasks', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all tasks', async () => {
      await request(app).post('/tasks').send({ title: 'A' });
      await request(app).post('/tasks').send({ title: 'B' });
      const res = await request(app).get('/tasks');
      expect(res.body.length).toBe(2);
    });

    it('filters by status', async () => {
      await request(app).post('/tasks').send({ title: 'A', status: 'todo' });
      await request(app).post('/tasks').send({ title: 'B', status: 'done' });
      const res = await request(app).get('/tasks?status=todo');
      expect(res.body.length).toBe(1);
    });

    it('paginates starting from the first item', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/tasks').send({ title: `T${i}` });
      }
      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('T0');
      expect(res.body[1].title).toBe('T1');
    });
  });

  describe('POST /tasks', () => {
    it('creates a task', async () => {
      const res = await request(app).post('/tasks').send({ title: 'New' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New');
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/tasks').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app).post('/tasks').send({ title: 'X', status: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid dueDate', async () => {
      const res = await request(app).post('/tasks').send({ title: 'X', dueDate: 'bad' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('updates a task', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).put(`/tasks/${created.body.id}`).send({ title: 'Y' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Y');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).put('/tasks/unknown').send({ title: 'Y' });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid update', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).put(`/tasks/${created.body.id}`).send({ status: 'bad' });
      expect(res.status).toBe(400);
    });

    it('does not allow changing the task id via PUT', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).put(`/tasks/${created.body.id}`).send({ id: 'hacked' });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes a task', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).delete(`/tasks/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/tasks/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('marks a task complete', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).patch(`/tasks/${created.body.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).patch('/tasks/unknown/complete');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /tasks/stats', () => {
    it('returns counts', async () => {
      await request(app).post('/tasks').send({ title: 'A', status: 'todo' });
      await request(app).post('/tasks').send({ title: 'B', status: 'done' });
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('todo', 1);
      expect(res.body).toHaveProperty('done', 1);
      expect(res.body).toHaveProperty('overdue', 0);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('assigns a task', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Alice' });
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Alice');
    });

    it('returns 404 for unknown task', async () => {
      const res = await request(app).patch('/tasks/unknown/assign').send({ assignee: 'Alice' });
      expect(res.status).toBe(404);
    });

    it('returns 400 if assignee is missing', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).patch(`/tasks/${created.body.id}/assign`).send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 if assignee is empty string', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      const res = await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: '' });
      expect(res.status).toBe(400);
    });

    it('allows reassigning an already-assigned task', async () => {
      const created = await request(app).post('/tasks').send({ title: 'X' });
      await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Alice' });
      const res = await request(app).patch(`/tasks/${created.body.id}/assign`).send({ assignee: 'Bob' });
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Bob');
    });
  });
});