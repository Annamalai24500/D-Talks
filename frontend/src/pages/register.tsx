import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from 'axios'
function Register() {
  const [username,setusername] = useState<string>("");
  const [email,setemail] = useState<string>("");
  const [password,setpassword] = useState<string>("");
  const navigate = useNavigate();
  const onSubmit = async(e) =>{
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register',{
        username,email,password
      });
      if(response.data.success && response.data.token){
        localStorage.setItem("token",response.data.token)
        console.log("Registered successfully");
      }
      navigate("/")
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <>
    <div className="flex h-screen justify-center items-center bg-black">
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Register your account</CardTitle>
        <CardDescription>
          Enter your credentials
        </CardDescription>
        <CardAction>
          <Button asChild>
            <Link to='/login'>Login
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}> 
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="username"
                placeholder="John"
                required
                onChange={(e)=>{setusername(e.target.value)}}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e)=>{setemail(e.target.value)}}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {/*later*/}
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required onChange={(e)=>{setpassword(e.target.value)}}/>
            </div>
          </div>
          <Button type="submit" className="w-full">
          Register
        </Button>
        </form>
      </CardContent>

    </Card>
    </div>
    </>
    
  )
}
export default Register