'use client'
import Link from "next/link";

const Header = () => {
  return (
    <header>
      <nav>
          <Link href="/"><li>Ülevaade</li></Link>
          <Link href="/client"><li>Klient</li></Link>
          <Link href="/events"><li>Sündmused</li></Link>
      </nav>
    </header>
  )
}
export default Header