import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to feed if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold font-poppins pixie-gradient-text">Pixie</h1>
          </div>
          <div className="space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="px-5 py-2 rounded-full font-medium transition hover:bg-gray-100">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="px-5 py-2 rounded-full font-medium text-white pixie-gradient transition-transform hover:shadow-lg hover:scale-105">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="pt-28 md:pt-48 pb-20 px-4 md:px-0 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold font-poppins leading-tight">
              Share moments, <span className="pixie-gradient-text">create memories</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Connect with friends, share your life, and explore creativity with our AI-powered tools. Pixie helps you stay connected in more meaningful ways.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/signup">
                <Button className="px-8 py-4 rounded-full font-medium text-white pixie-gradient transition-transform hover:shadow-lg hover:scale-105">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="px-8 py-4 rounded-full font-medium border border-gray-300 transition hover:border-gray-400">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-in">
            <div className="w-full h-[500px] rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg overflow-hidden relative">
              <div className="absolute top-6 left-6 right-6 h-14 bg-white rounded-xl shadow-sm flex items-center px-4">
                <div className="flex items-center">
                  <span className="pixie-gradient text-white h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold">P</span>
                  <span className="ml-3 font-semibold">Pixie</span>
                </div>
              </div>
              <div className="absolute top-24 left-6 right-6 bottom-6 overflow-hidden">
                <div className="grid grid-cols-2 gap-3 h-full">
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl h-48 shadow-sm overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1496440737103-cd596325d314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Beach sunset" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white rounded-xl flex-1 shadow-sm overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1522073607222-f7e9a6c3c110?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Person with hat" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <div className="bg-white rounded-xl shadow-sm flex-1 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1536329583941-14287ec6fc4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="City lights" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden h-40">
                      <img src="https://images.unsplash.com/photo-1514315384763-ba401779410f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" alt="Coffee and laptop" className="w-full h-full object-cover" />
                    </div>
                    <div className="glass-effect rounded-xl shadow-sm h-12 flex items-center justify-center text-sm font-medium text-white">
                      <i className="ri-add-line mr-2"></i> Create with AI
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 w-full h-full bg-gradient-to-r from-[#5851DB]/20 to-[#E1306C]/20 rounded-xl top-6 left-6 blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-0 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4">Experience Pixie Like Never Before</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover the features that make Pixie unique and tailored to your creative needs.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 pixie-gradient rounded-full flex items-center justify-center text-white mb-4">
                <i className="ri-user-line text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-poppins">Connect & Share</h3>
              <p className="text-gray-600">Build your profile, connect with friends, and share your most memorable moments.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 pixie-gradient rounded-full flex items-center justify-center text-white mb-4">
                <i className="ri-chat-3-line text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-poppins">Seamless Messaging</h3>
              <p className="text-gray-600">Chat with your connections in real-time with our intuitive messaging interface.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 pixie-gradient rounded-full flex items-center justify-center text-white mb-4">
                <i className="ri-magic-line text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-poppins">AI Image Creation</h3>
              <p className="text-gray-600">Generate stunning images from text prompts or transform existing photos with our AI tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 px-4 md:px-0">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-poppins mb-4">Your New Social Experience</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Preview the Pixie experience on any device.</p>
          </div>
          
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl shadow-xl">
            <img src="https://images.unsplash.com/photo-1603145733146-ae562a55031e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" alt="App interface mockup" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#5851DB]/80 to-[#E1306C]/80 flex items-center justify-center">
              <Link href="/signup">
                <Button className="bg-white text-gray-800 font-semibold py-3 px-6 rounded-full hover:bg-gray-100 transition flex items-center">
                  <i className="ri-play-circle-line mr-2 text-xl"></i> See Pixie in Action
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
