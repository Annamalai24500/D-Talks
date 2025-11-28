import { useState } from 'react'
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Login from './pages/login'
import Register from './pages/register'
import Home from './pages/home'
import Protectedroute from './components/ui/protectedroute'
import Room from './pages/room'
import { CallProvider } from './webrtcutilites/callcontext'
function App() {

  return (
    <>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<Protectedroute><Home/></Protectedroute>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/register' element={<Register/>}></Route>
        <Route path='/room/:roomId' element={<Protectedroute><CallProvider><Room/></CallProvider></Protectedroute>}></Route>
      </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
