import { createHash } from 'crypto';
import {
  AllowNull,
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import Todo from './todo.model';

@Table({ name: { singular: 'user', plural: 'users' }, tableName: 'users' })
export default class User extends Model<User> {
  /**
   * Attributes
   */
  @AutoIncrement
  @PrimaryKey
  @Column
  id: number;

  @AllowNull(false)
  @Unique
  @Column
  username: string;

  @AllowNull(false)
  @Column
  password: string;

  @AllowNull(false)
  @Default('User')
  @Column({ type: DataType.ENUM('Admin', 'User') })
  role: 'Admin' | 'User';

  @HasMany(() => Todo)
  todos: Todo[];

  /**
   * Hooks
   */
  @BeforeCreate
  @BeforeUpdate
  static hashPassword(instance: User) {
    instance.password = createHash('SHA512').update(instance.password).digest('base64');
  }

  /**
   * Class Methods
   */
  static async findByUsername(username: string) {
    return this.find<User>({ where: { username } });
  }

  /**
   * Instance Methods
   */
  async findMyUsername() {
    return this.username;
  }
}

export type UserAttributes = Pick<User, 'id' | 'username' | 'password'>;
export type UserAttributesOpt = Partial<UserAttributes>;
