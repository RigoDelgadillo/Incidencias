import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

const SignOutButton = () => {
  return (
    <Pressable onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}>
            <Text>Cerrar sesión</Text>
    </Pressable>
  )
}

export default SignOutButton