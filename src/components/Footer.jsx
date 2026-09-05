import { Link } from "react-router-dom";

const heading = "mb-3 inline-block border-b-2 border-crimson pb-2 text-base font-bold";
const text = "max-w-[60ch] text-sm leading-7 text-gray-500 not-italic";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white pt-12">
      <div className="mx-auto w-[min(1180px,100%-40px)]">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:gap-12">
          <div>
            <h4 className={heading}>About</h4>
            <p className={text}>
              SkillCoach is a portal for growth that enables businesses and individuals to collaborate,
              share, and succeed no matter what the project, assignment, or goal. We provide free education
              tools — collaboration, lesson building, and performance monitoring — that businesses can also
              use to create projects, manage employees, and track performance. We don't charge anything
              for the service.
            </p>
          </div>
          <div>
            <h4 className={heading}>Contact us</h4>
            <address className={text}>
              SkillCoach<br />
              PO Box 922<br />
              La Jolla CA 92038<br />
              Email:{" "}
              <a href="mailto:support@skillcoach.org" className="hover:text-crimson">
                support@skillcoach.org
              </a>
            </address>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-5 border-t border-gray-200 py-4 text-[13px] text-gray-500">
          <span>© {new Date().getFullYear()} SkillCoach</span>
          <Link to="/privacy" className="hover:text-crimson">Privacy</Link>
          <Link to="/terms" className="hover:text-crimson">Terms of Service</Link>
          <Link to="/contact" className="hover:text-crimson">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
