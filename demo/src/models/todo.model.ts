import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import User from './user.model';

@Table({ name: { singular: 'todo', plural: 'todos' }, tableName: 'todos' })
export default class Todo extends Model<Todo> {
  @AutoIncrement
  @PrimaryKey
  @Column
  id: number;

  @AllowNull(false)
  @Column
  title: string;

  @Column description?: string;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User, { foreignKey: { allowNull: false, field: 'userId' } })
  user: User;
}

export type TodoModel = typeof Todo;
export type TodoAttributes = Pick<Todo, 'id' | 'title' | 'description' | 'userId' | 'user'>;
export type TodoAttributesOpt = Partial<TodoAttributes>;
