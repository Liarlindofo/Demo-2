import { redirect } from 'next/navigation';

// /rider → redireciona para o login do portal
// Se autenticado, o middleware ou a própria /rider/dashboard cuida do redirect
export default function RiderRoot() {
  redirect('/rider/login');
}
