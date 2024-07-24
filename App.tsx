import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Platform,
  PermissionsAndroid,
  StyleSheet,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const App = () => {
  const [location, setLocation] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      if (status === RESULTS.GRANTED) {
        getLocation();
      } else {
        const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (result === RESULTS.GRANTED) {
          getLocation();
        } else {
          console.log('Location permission denied');
        }
      }
    } else if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'We need access to your location to show nearby restaurants.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getLocation();
      } else {
        console.log('Location permission denied');
      }
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(loc);
        fetchRestaurants(loc);
      },
      error => console.log(error),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  };

  const fetchRestaurants = async loc => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: 'restaurant',
            format: 'json',
            limit: 10,
            viewbox: `${loc.longitude - 0.01},${loc.latitude + 0.01},${
              loc.longitude + 0.01
            },${loc.latitude - 0.01}`,
            bounded: 1,
          },
        },
      );
      setRestaurants(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // console.log('lat==>', lat1, lon1, lat2, lon2);
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>Your Location:</Text>
          <Text style={styles.locationCoords}>
            Latitude: {location.latitude.toFixed(4)}, Longitude:{' '}
            {location.longitude.toFixed(4)}
          </Text>
        </View>
      )}
      <FlatList
        data={restaurants}
        keyExtractor={item => item.place_id}
        renderItem={({item}) => (
          <View style={styles.listItem}>
            <Text style={styles.name}>{item.display_name}</Text>
            <Text style={styles.address}>{item.display_name}</Text>
            {location && (
              <Text style={styles.distance}>
                {calculateDistance(
                  location.latitude,
                  location.longitude,
                  parseFloat(item.lat),
                  parseFloat(item.lon),
                ).toFixed(2)}{' '}
                km
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
  },
  locationContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  distance: {
    fontSize: 12,
    color: '#999',
  },
});

export default App;
