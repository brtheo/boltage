import soqlQuery from '@salesforce/apex/Bolt.soqlQuery';
import soqlQueryWithoutCache from "@salesforce/apex/Bolt.soqlQueryWithoutCache";

const USER_MODE = 'WITH USER_MODE';
const UNCACHED = 'UNCACHED';
const LIMIT_ONE = 'LIMIT 1';
const ARRAY_TOKEN = '$ARRAY$'
class Token {
  static WHERE = 'WHERE';
  static IN = 'IN';
  static LIKE = 'LIKE';
  static AND = 'AND';
  static LIMIT = 'LIMIT';
  static OFFSET = 'OFFSET';
  static SELECT = 'SELECT';
  static FROM = 'FROM';
  currentToken;
  constructor(token) {
    this.currentToken = token;
  }
  is(token) {
    return this.currentToken.includes(token);
  }
}

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
    const token = new Token(curr.toUpperCase());
    switch(true) {
      case typeof args[i] === 'function':
        return `${acc}${curr}${args[i]()}`
      case token.is(Token.IN) && args[i] instanceof Array:
        params[argName] = ARRAY_TOKEN + JSON.stringify(args[i].reduce((obj, curr) => ({...obj, [curr]:''}), {}));
        return `${acc}${curr}:${argName}`;
      case token.is(Token.WHERE):
      case token.is(Token.AND):
      case token.is(Token.LIKE):
      case token.is(Token.OFFSET):
      case token.is(Token.LIMIT):
        params[argName] = args[i]
        return `${acc}${curr}:${argName}`;
      case token.is(Token.SELECT) && args[i] instanceof Array:
        return `${acc}${curr}${args[i].join(',')}`;
      case token.is(Token.FROM):
      case token.is(Token.SELECT):
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
  if(query.includes(LIMIT_ONE)) {
    query = query.replace(LIMIT_ONE, '');
    return soqlQuery({query, params: JSON.stringify(params), mode, onlyFirst: true})
  }

  return soqlQuery({query, params: JSON.stringify(params), mode});
}
