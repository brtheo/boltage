public with sharing class Bolt {
  public final static String STARTS_WITH_ARRAY_TOKEN = '$ARRAY$';
  public static WithoutSharingProvider withoutSharing { get { return new WithoutSharingProvider(); } }
  @AuraEnabled(cacheable=true)
  public static Object[] soqlQuery(String query, String params, String mode) {
    return soqlQueryWithoutCache(query, params, mode);
  }
  @AuraEnabled()
  public static Object[] soqlQueryWithoutSharing(String query, String params, String mode) {
    return withoutSharing.soqlQuery(query, params, mode);
  }
  @auraEnabled
  public static Object[] soqlQueryWithoutCache(String query, String params, String mode) {
    AccessLevel level = mode == 'WITH USER_MODE' ? AccessLevel.USER_MODE : AccessLevel.SYSTEM_MODE;
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
      level
    );
  }
  private without sharing class WithoutSharingProvider {
    public Object[] soqlQuery(String query, String params, String mode) {
      AccessLevel level = mode == 'WITH USER_MODE' ? AccessLevel.USER_MODE : AccessLevel.SYSTEM_MODE;
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
        level
      );
    }
  }
}