import { Link } from 'expo-router'
import { Image, Text, View } from 'react-native'

const adminManagement = () => {
  return (
    <View className='flex-1 justify-center items-center mb-50 gap-5'>

      <Link 
        className='p-10 max-w-80 rounded-xl shadow-xl bg-white border-2 border-slate-300'
        href={'/CRUDusuarios'}
      >
        <View className='flex flex-col justify-center items-center mb-10'>
          <Image  source={require('../../assets/images/UsersIcon.png')} />
          <Text 
            className='font-Inter-Bold text-xl mt-4'
          >Gestion Usuarios</Text>
        </View>

      </Link>

      <Link 
        className='p-10 max-w-80 rounded-xl shadow-xl bg-white border-2 border-slate-300'
        href={'/CRUDcategorias'}
      >
        <View className='flex flex-col justify-center items-center'>
          <Image className='w-20 h-20' source={require('../../assets/images/cate1212.png')} />
          <Text 
            className='font-Inter-Bold text-xl mt-4'
          >Gestion Categorias</Text>
        </View>

      </Link>

      <Link 
        className='p-10 max-w-80 rounded-xl shadow-xl bg-white border-2 border-slate-300'
        href={'/CRUDequipos'}
      >
        <View className='flex flex-col justify-center items-center mb-10'>
          <Image className='w-20 h-20' source={require('../../assets/images/equi1212.png')} />
          <Text 
            className='font-Inter-Bold text-xl mt-4'
          >Gestion Equipos</Text>
        </View>

      </Link>

    </View>
  )
}

export default adminManagement