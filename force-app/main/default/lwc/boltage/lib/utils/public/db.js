import soqlQuery from '@salesforce/apex/Bolt.soqlQuery';
import soqlQueryWithoutCache from "@salesforce/apex/Bolt.soqlQueryWithoutCache";
import soqlQueryWithoutSharing from "@salesforce/apex/Bolt.soqlQueryWithoutSharing";

const USER_MODE = 'WITH USER_MODE';
const UNCACHED = 'UNCACHED';
const WITHOUT_SHARING = 'WITHOUT_SHARING';
const LIMIT_ONE = 'LIMIT 1';
const ARRAY_TOKEN = '$ARRAY$'
/**
  * @param {string[]} req
  * @param {any[]} args
*/
export const db = async (req, ...args ) => {
  /** @type {{[key:string]:any}} */
  const params = {};
  let query = req.reduce((acc, curr, i) => {
  if(args[i] !== undefined) {
    const argName = `arg${i}`;
    const _curr = curr.toLowerCase()
    switch(true) {
      case typeof args[i] === 'function':
        return `${acc}${curr}${args[i]()}`
      case _curr.includes('in') && args[i] instanceof Array:
        params[argName] = ARRAY_TOKEN + JSON.stringify(args[i].reduce((obj, curr) => ({...obj, [curr]:''}), {}));
        return `${acc}${curr}:${argName}`;
      case _curr.includes('where'):
      case _curr.includes('and'):
      case _curr.includes('offset'):
      case _curr.includes('limit'):
      case _curr.includes('like'):
        params[argName] = args[i]
        return `${acc}${curr}:${argName}`;
      case _curr.includes('select') && args[i] instanceof Array:
        return `${acc}${curr}${args[i].join(',')}`;
      case _curr.includes('from'):
      case _curr.includes('select'):
        return `${acc}${curr}${args[i]}`;
      default: return '';
    }
  } else if(args.length === 0) return curr
  else return `${acc}${curr}`;
  }, '');
  let mode = USER_MODE;
  if(query.includes(USER_MODE))
    query = query.replace(USER_MODE, '');
  else mode = null;
  if(query.includes(UNCACHED)){
    query = query.replace(UNCACHED, '');
    return soqlQueryWithoutCache({query, params: JSON.stringify(params), mode});
  }
  else if(query.includes(WITHOUT_SHARING)){
    query = query.replace(WITHOUT_SHARING, '');
    return soqlQueryWithoutSharing({query, params: JSON.stringify(params), mode});
  }
  if(query.includes(LIMIT_ONE)) {
    query = query.replace(LIMIT_ONE, '');
    return soqlQuery({query, params: JSON.stringify(params), mode, onlyFirst: true})
  }

  return soqlQuery({query, params: JSON.stringify(params), mode});
}

export const query = (req, ...args) => {
  return 'ELECT Id FROM Case WHERE Name = {{hello}} LIMIT 1'
}