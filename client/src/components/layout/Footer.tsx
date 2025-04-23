import { Link } from 'wouter';
import { Twitter, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold font-poppins pixie-gradient-text mb-4">Pixie</h3>
            <p className="text-gray-600 text-sm">Share moments, create memories.</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#"><a className="hover:text-[#5851DB]">About Us</a></Link></li>
              <li><Link href="#"><a className="hover:text-[#5851DB]">Careers</a></Link></li>
              <li><Link href="#"><a className="hover:text-[#5851DB]">News</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#"><a className="hover:text-[#5851DB]">Help Center</a></Link></li>
              <li><Link href="#"><a className="hover:text-[#5851DB]">Community</a></Link></li>
              <li><Link href="#"><a className="hover:text-[#5851DB]">Developers</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#"><a className="hover:text-[#5851DB]">Privacy Policy</a></Link></li>
              <li><Link href="#"><a className="hover:text-[#5851DB]">Terms of Service</a></Link></li>
              <li><Link href="#"><a className="hover:text-[#5851DB]">Cookie Policy</a></Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Pixie. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-[#5851DB]">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-[#5851DB]">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-[#5851DB]">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
