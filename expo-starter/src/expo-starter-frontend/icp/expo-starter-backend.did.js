export const idlFactory = ({ IDL }) => {
  return IDL.Service({ 'whoami' : IDL.Func([], [IDL.Text], ['query']) });
};
export const init = ({ IDL }) => { return []; };
