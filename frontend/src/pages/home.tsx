import React, { useEffect, useState } from 'react'
import { Navbar01 } from '../components/ui/shadcn-io/navbar-01';
import { useNavigate } from 'react-router-dom';
import { CreateModal } from '@/components/ui/custom-components/modal';
import axios from 'axios';
type UserProps = {
  id: number,
  username: string,
  email: string
}
function Home() {
  const navigate = useNavigate();
  const [showcreateroom, setShowCreateRoom] = useState<boolean>(false)
  const [showjoinroom, setShowJoinRoom] = useState<boolean>(false)
  const [user, setuser] = useState<UserProps>()
  const [roomid, setroomid] = useState<number>()
  function onRequestClose() {
    setShowCreateRoom(false)
  }
  const getData = async () => {
    try {
      const token = await localStorage.getItem("token");
      console.log("Token:", token);
      const response = await axios.get('http://localhost:8080/api/auth/get-current-user', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 5000
      });
      console.log("Response:", response);
      if (response.data.success && response.data.user) {
        setuser(response.data.user)
        console.log("Data fetched successfully")
      } else {
        console.log("Backend response error:", response.data)
      }
    } catch (error: any) {
      console.log("Full error details:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);
      console.log("Error response:", error.response);

      if (error.code === 'ERR_NETWORK') {
        console.log("Network error - backend might be down or CORS issue");
      } else if (error.response) {
        console.log("Backend error status:", error.response.status);
        console.log("Backend error data:", error.response.data);
      }
    }
  }
  const createroom = async () => {
    try {
      if(!user){
        return console.log("User is not loaded yet")
      }
      const response = await axios.post(`http://localhost:8080/api/room/createroom/${user.id}`);
      if (response.data.success && response.data.room_code) {
        setroomid(response.data.room_code)
        console.log("Room created successfully")
      } else {
        console.log("Some error lol")
      }
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    setTimeout(()=>{
      getData();
    },10000)
  }, []);
  return (
    <>
      <div className="relative w-full">
        <Navbar01 signInHref='/login' onSignInClick={() => { navigate("/login") }}
          navigationLinks={[
            { href: '#', label: 'Home', active: true },
            { href: '#', label: 'Create Room', onClick: () => {
              if(!user){return console.log("User is undefined")}
              setShowCreateRoom(true) }},
            { href: '#', label: 'Join Room', onClick: () => setShowJoinRoom(true) },
            { href: '#', label: 'About' },
          ]}
        />
      </div>
      <CreateModal showcreatemodal={showcreateroom} onRequestClose={onRequestClose} createroom={createroom} roomid={roomid} />
    </>
  )
}

export default Home
