const { validateCreateTask, validateUpdateTask, validateAssignTask } = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateCreateTask', () => {
    it('returns error if title is omitted', () => {
      const error = validateCreateTask({ description: 'test' });
      expect(error).toBe('title is required and must be a non-empty string');
    });

    it('returns error if title is empty string', () => {
      const error = validateCreateTask({ title: '   ' });
      expect(error).toBe('title is required and must be a non-empty string');
    });

    it('returns error if status is invalid', () => {
      const error = validateCreateTask({ title: 'T', status: 'unknown' });
      expect(error).toBe('status must be one of: todo, in_progress, done');
    });

    it('returns error if priority is invalid', () => {
      const error = validateCreateTask({ title: 'T', priority: 'unknown' });
      expect(error).toBe('priority must be one of: low, medium, high');
    });

    it('returns error if dueDate is invalid', () => {
      const error = validateCreateTask({ title: 'T', dueDate: 'invalid-date' });
      expect(error).toBe('dueDate must be a valid ISO date string');
    });

    it('returns null for valid input', () => {
      const error = validateCreateTask({ title: 'T', status: 'todo', priority: 'high', dueDate: '2023-01-01T00:00:00.000Z' });
      expect(error).toBeNull();
    });
  });

  describe('validateUpdateTask', () => {
    it('returns error if title is empty', () => {
      const error = validateUpdateTask({ title: '  ' });
      expect(error).toBe('title must be a non-empty string');
    });

    it('returns error if status is invalid', () => {
      const error = validateUpdateTask({ status: 'unknown' });
      expect(error).toBe('status must be one of: todo, in_progress, done');
    });

    it('returns error if priority is invalid', () => {
      const error = validateUpdateTask({ priority: 'unknown' });
      expect(error).toBe('priority must be one of: low, medium, high');
    });

    it('returns error if dueDate is invalid', () => {
      const error = validateUpdateTask({ dueDate: 'invalid' });
      expect(error).toBe('dueDate must be a valid ISO date string');
    });

    it('returns null for valid update input without title', () => {
      const error = validateUpdateTask({ status: 'in_progress' });
      expect(error).toBeNull();
    });

    describe('validateAssignTask', () => {
      it('returns error if assignee is missing', () => {
        const error = validateAssignTask({});
        expect(error).toBe('assignee is required');
      });

      it('returns error if assignee is empty string', () => {
        const error = validateAssignTask({ assignee: '  ' });
        expect(error).toBe('assignee must be a non-empty string');
      });

      it('returns null for valid assignee', () => {
        const error = validateAssignTask({ assignee: 'John Doe' });
        expect(error).toBeNull();
      });
    });
  });
});
