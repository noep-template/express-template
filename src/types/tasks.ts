export interface TaskDTO {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface TaskCreate {
  title: string;
}

export interface TaskUpdate {
  title?: string;
  completed?: boolean;
}
