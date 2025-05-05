@isTest
public with sharing class Boltage_Test {
  @isTest()
  public static void testDynamicSOQL() {
    Test.startTest();
    Boltage.soqlQuery('SELECT Id FROM Case LIMIT 1', '{}', 'WITH USER_MODE',true);
    Test.stopTest();
  }
  @isTest()
  public static void testDynamicSOQLWithArrayArgBindings() {
    Test.startTest();
    Boltage.soqlQuery(
      'SELECT Id FROM Case WHERE Id in :arg0 LIMIT 1',
      '{"arg0":"$ARRAY${}"}',
      'WITH USER_MODE',
      true
    );
    Test.stopTest();
  }
}
