import Drawer from 'expo-router/drawer';
import React from 'react';
import { View } from 'react-native';

import CustomButton from '@/components/CustomButton';
import CustomHeaderTitleDrawer from '@/components/CustomHeaderTitleDrawer';
import { supabase } from '@/utils/supabase';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';


const CustomDrawerContent = (props : DrawerContentComponentProps) => (
  <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
    <DrawerItemList {...props} />
      <View className= 'mt-auto p-4'>
        <CustomButton
        label="Cerrar sesión"
        color="bg-red-500"
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
        />
      </View>
  </DrawerContentScrollView>
);

const UserLayout = () => {
  return (
    <Drawer drawerContent={CustomDrawerContent}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Inicio",
          headerTitle: () => <CustomHeaderTitleDrawer
            title="Mis incidencias"
          />,
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="myProfile"
        options={{
          drawerLabel: "Mi perfil",
          headerTitle: () => <CustomHeaderTitleDrawer 
          title="Mi perfil"
          />,
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="crearIncidencia"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  )
}

export default UserLayout