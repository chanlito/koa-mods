import User from '../models/user.model';

export const validationCustomRules = [ uniqueUsername ];

function uniqueUsername(data: any, field: string, message: string, args: any[], get: Function) {
  return new Promise((resolve, reject) => {
    const fieldValue = get(data, field);
    if (!fieldValue) return resolve('skipped validation'); // let the required rule handle this

    User.findByUsername(fieldValue)
      .then(user => {
        if (user) {
          reject('The username entered is taken.');
        } else {
          resolve('validation passed');
        }
      })
      .catch(e => reject(e));
  });
}
