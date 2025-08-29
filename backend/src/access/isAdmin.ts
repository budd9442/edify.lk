import { Access } from 'payload/types';

export const isAdmin: Access = ({ req: { user } }) => {
  return user?.role === 'admin';
};

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  if (user?.role === 'admin') return true;
  if (user?.id === id) return true;
  return false;
};

export const isAuthor: Access = ({ req: { user } }) => {
  return user?.role === 'author' || user?.role === 'editor' || user?.role === 'admin';
};

export const isEditor: Access = ({ req: { user } }) => {
  return user?.role === 'editor' || user?.role === 'admin';
};

export const isAuthenticated: Access = ({ req: { user } }) => {
  return !!user;
};

export const isPublic: Access = () => {
  return true;
};
