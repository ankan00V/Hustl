import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => (
  <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' }, props.style]}>
    <Text style={{ color: '#aaa', fontSize: 12 }}>Mock Map View (Web)</Text>
    {props.children}
  </View>
);

export const Marker = (props) => (
  <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 16 }}>📍</Text>
    <Text style={{ color: '#fff', fontSize: 10 }}>{props.title}</Text>
    {props.children}
  </View>
);

export const Polyline = (props) => (
  <View style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: props.strokeColor || '#fff', width: '100%' }} />
);

MapView.Marker = Marker;
MapView.Polyline = Polyline;

export default MapView;
