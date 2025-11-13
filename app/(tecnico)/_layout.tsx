import CustomButton from '@/components/CustomButton';
import CustomHeaderTitleDrawer from '@/components/CustomHeaderTitleDrawer';
import { supabase } from '@/utils/supabase';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import Drawer from 'expo-router/drawer';
import React from 'react';
import { View } from 'react-native';

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

const TecnicoLayout = () => {
  return (
    <Drawer drawerContent={CustomDrawerContent}>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Inicio",
          headerTitle: () => <CustomHeaderTitleDrawer
            title="Mis Reportes"
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
    </Drawer>
  )
}

export default TecnicoLayout