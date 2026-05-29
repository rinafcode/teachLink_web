/**
 * Unit tests for Privacy Policy page component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';

describe('Privacy Policy Page', () => {
  describe('PrivacyPolicyContent Component', () => {
    it('should render content for English locale', () => {
      render(<PrivacyPolicyContent locale="en" />);

      const heading = screen.getByText(/Introduction/i);
      expect(heading).toBeInTheDocument();
    });

    it('should render content for Spanish locale', () => {
      render(<PrivacyPolicyContent locale="es" />);

      const heading = screen.getByText(/Introducción/i);
      expect(heading).toBeInTheDocument();
    });

    it('should render content for French locale', () => {
      render(<PrivacyPolicyContent locale="fr" />);

      const heading = screen.getByText(/Introduction/i);
      expect(heading).toBeInTheDocument();
    });

    it('should default to English for unsupported locale', () => {
      render(<PrivacyPolicyContent locale="xx" />);

      const heading = screen.getByText(/Introduction/i);
      expect(heading).toBeInTheDocument();
    });

    it('should include all required sections in English', () => {
      render(<PrivacyPolicyContent locale="en" />);

      const sections = [
        'Introduction',
        'Information We Collect',
        'How We Use Your Information',
        'Data Security',
        'Your Privacy Rights',
        'Contact Us',
      ];

      sections.forEach(section => {
        expect(screen.getByText(new RegExp(section, 'i'))).toBeInTheDocument();
      });
    });

    it('should include privacy contact email', () => {
      render(<PrivacyPolicyContent locale="en" />);

      const email = screen.getByText('privacy@teachlink.com');
      expect(email).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<PrivacyPolicyContent locale="en" />);

      const h2Elements = container.querySelectorAll('h2');
      expect(h2Elements.length).toBeGreaterThan(0);

      const h3Elements = container.querySelectorAll('h3');
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should include list elements for key information', () => {
      render(<PrivacyPolicyContent locale="en" />);

      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should include links to sections with proper IDs', () => {
      const { container } = render(<PrivacyPolicyContent locale="en" />);

      const sections = ['introduction', 'information-collection', 'data-security', 'your-rights'];
      sections.forEach(section => {
        const element = container.querySelector(`[id="${section}"]`);
        expect(element).toBeInTheDocument();
      });
    });

    it('should include data security measures in English', () => {
      render(<PrivacyPolicyContent locale="en" />);

      const securityMeasures = [
        'SSL/TLS encryption',
        'Regular security audits',
        'Access controls',
      ];

      securityMeasures.forEach(measure => {
        expect(screen.getByText(new RegExp(measure, 'i'))).toBeInTheDocument();
      });
    });

    it('should include user rights section in English', () => {
      render(<PrivacyPolicyContent locale="en" />);

      const rights = ['Access', 'Correction', 'Deletion', 'Portability'];

      rights.forEach(right => {
        expect(screen.getByText(new RegExp(right, 'i'))).toBeInTheDocument();
      });
    });

    it('should have proper language-specific content for Spanish', () => {
      render(<PrivacyPolicyContent locale="es" />);

      expect(screen.getByText(/Información que Recopilamos/i)).toBeInTheDocument();
      expect(screen.getByText(/Seguridad de Datos/i)).toBeInTheDocument();
    });

    it('should have proper language-specific content for French', () => {
      render(<PrivacyPolicyContent locale="fr" />);

      expect(screen.getByText(/Informations que nous collectons/i)).toBeInTheDocument();
      expect(screen.getByText(/Sécurité des données/i)).toBeInTheDocument();
    });

    it('should render without errors', () => {
      expect(() => {
        render(<PrivacyPolicyContent locale="en" />);
      }).not.toThrow();
    });

    it('should handle locale changes', () => {
      const { rerender } = render(<PrivacyPolicyContent locale="en" />);
      expect(screen.getByText(/Introduction/i)).toBeInTheDocument();

      rerender(<PrivacyPolicyContent locale="es" />);
      expect(screen.getByText(/Introducción/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const { container } = render(<PrivacyPolicyContent locale="en" />);

      const h2s = container.querySelectorAll('h2');
      const h3s = container.querySelectorAll('h3');

      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should include links for table of contents', () => {
      render(<PrivacyPolicyContent locale="en" />);

      // Links should be present
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
