import type { TaskStoreState } from '../initialState';

const viewMode = (s: TaskStoreState) => s.viewMode;

const listVisibility = (s: TaskStoreState) => s.listVisibility;

export const taskListSelectors = {
  listVisibility,
  viewMode,
};
