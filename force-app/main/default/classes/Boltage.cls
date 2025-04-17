public with sharing class Bolt {
  public final static String STARTS_WITH_ARRAY_TOKEN = '$ARRAY$';

  @AuraEnabled(cacheable=true)
  public static Object soqlQuery(String query, String params, String mode, Boolean onlyFirst) {
    List<Object> o = soqlQueryWithoutCache(query, params, mode);
    if(onlyFirst) {
      return o.size() != 0
        ? o[0]
        : null;
    }
    return o;
  }
  @auraEnabled
  public static Object[] soqlQueryWithoutCache(String query, String params, String mode) {
    Map<String,Object> bindParams = (Map<String,Object>) JSON.deserializeUntyped(params);
    Map<String,Object> currentArrayArg = new Map<String, Object>();
    for(String key : bindParams.keySet()){
      String maybeArrayPayload = String.valueOf(bindParams.get(key));
      if(maybeArrayPayload.startsWith(STARTS_WITH_ARRAY_TOKEN)){
        currentArrayArg = (Map<String,Object>) JSON.deserializeUntyped(
         maybeArrayPayload.replace(STARTS_WITH_ARRAY_TOKEN, '')
        );
        bindParams.put(key, currentArrayArg.keySet());
      }
    }
    return Database.queryWithBinds(
      query,
      bindParams,
      AccessLevel.USER_MODE
    );
  }
}
