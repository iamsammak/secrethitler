import { Mongo } from 'meteor/mongo';

export const Rooms = new Mongo.Collection("rooms");
export const Players = new Mongo.Collection("players");
