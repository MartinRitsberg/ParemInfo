'use client'
import { useAppContext } from "../context/AppContext"
import ClientButton from "./ClientButton"
import Link from "next/link"

const Sidebar = () => {
  const { app } = useAppContext()

  return (
    <side>
      {/* Excel Manager Button */}
      <Link href="/excel-manager" className="block mb-4">
        <button className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">
          Excel Manager
        </button>
      </Link>
      
      {/* Client List */}
      {app.clientList.map((client) => (
        <ClientButton 
          key={client.id} 
          clientName={client.eesnimi + " " + client.perenimi} 
          clientId={client.id} 
        />
      ))}
    </side>
  )
}

export default Sidebar