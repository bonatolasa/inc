export const NotificationEvents = {
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_UPDATED: 'task.updated',
  TASK_TESTING_REQUESTED: 'task.testing_requested',
  TASK_BUG_REOPENED: 'task.bug_reopened',
  COMMENT_CREATED: 'comment.created',
  PROJECT_CREATED: 'project.created',
} as const;

export type NotificationEventName =
  (typeof NotificationEvents)[keyof typeof NotificationEvents];

export type NotificationEventPayload = {
  recipients: string[];
  title: string;
  message: string;
  type: string;
  relatedId?: string;
};
