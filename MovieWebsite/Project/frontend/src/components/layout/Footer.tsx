import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-netflix-dark border-t border-netflix-hover py-8 px-4 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-netflix-text-secondary">
          <div>
            <h3 className="text-white font-semibold mb-4">Về CineStream</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white transition-colors">Giới thiệu</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Liên hệ</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Tuyển dụng</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Pháp lý</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Preferences</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">Thông báo pháp lý</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Kết nối</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-netflix-hover text-center text-xs text-netflix-text-muted">
          <p>&copy; {new Date().getFullYear()} CineStream. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}