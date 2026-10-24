import { useNetInfo } from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const { isConnected, isInternetReachable, type } = useNetInfo();
  const isOffline = isConnected === false || isInternetReachable === false;
  return { isOffline, isWifi: type === 'wifi' || type === 'ethernet' };
};
