export function Footer() {
  return (
    <footer className="py-8 px-6 md:px-20 border-t border-border">
      <p className="text-sm text-ink-muted text-center">
        ApartmentAgent &copy; {new Date().getFullYear()}
      </p>
    </footer>
  );
}
