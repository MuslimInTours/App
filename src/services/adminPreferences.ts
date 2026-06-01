import AsyncStorage from '@react-native-async-storage/async-storage';

const rememberAdminStorageKey = 'muslimin:remember-admin:v1';

export async function loadRememberAdmin() {
  const value = await AsyncStorage.getItem(rememberAdminStorageKey);
  return value === null ? true : value === 'true';
}

export async function saveRememberAdmin(rememberAdmin: boolean) {
  await AsyncStorage.setItem(rememberAdminStorageKey, String(rememberAdmin));
}
