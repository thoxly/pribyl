import { Context } from 'telegraf';
import { IUser } from '../models/User'; 
import { ITask } from '../models/Task'; 
import { ISession } from '../models/Session'; 
import { IPosition } from '../models/Position'; 

export type BotContext = Context & {
  user?: IUser;
  task?: ITask | null;
  session?: ISession | null;
  position?: IPosition | null;
};
