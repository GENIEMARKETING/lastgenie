import { Shield, Beaker, Award, CheckCircle } from 'lucide-react';

export default function SciencePage() {
  const ingredients = [
    {
      name: 'L-Arginine',
      category: 'Amino Acid',
      benefit: 'Supports healthy blood flow and circulation',
      research: 'Multiple clinical studies show L-Arginine may help support nitric oxide production.'
    },
    {
      name: 'Tribulus Terrestris',
      category: 'Plant Extract',
      benefit: 'Traditional support for vitality and energy',
      research: 'Used traditionally in Ayurvedic medicine for centuries to support wellness.'
    },
    {
      name: 'Maca Root',
      category: 'Adaptogen',
      benefit: 'Natural energy and stamina support',
      research: 'Studies suggest maca may help support energy levels and overall vitality.'
    },
    {
      name: 'Ginseng Extract',
      category: 'Adaptogen',
      benefit: 'Stress adaptation and energy enhancement',
      research: 'Well-researched adaptogen with numerous studies on energy and stress response.'
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-6">
            The Science Behind Genie
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            We believe in transparency and scientific integrity. Learn about the natural ingredients 
            and research that goes into every bottle of Genie.
          </p>
        </div>

        {/* Quality Standards */}
        <section className="mb-20">
          <h2 className="font-display text-3xl font-bold text-text-primary text-center mb-12">
            Our Quality Standards
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">
                GMP Certified
              </h3>
              <p className="text-text-secondary">
                Our facility follows Good Manufacturing Practices with rigorous quality control 
                and testing protocols.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Beaker className="h-16 w-16 text-secondary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">
                Third-Party Tested
              </h3>
              <p className="text-text-secondary">
                Every batch is independently tested for purity, potency, and safety by 
                certified laboratories.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Award className="h-16 w-16 text-accent mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">
                Premium Sourcing
              </h3>
              <p className="text-text-secondary">
                We source only the highest quality ingredients from trusted suppliers 
                with verified certifications.
              </p>
            </div>
          </div>
        </section>

        {/* Ingredients Science */}
        <section className="mb-20">
          <h2 className="font-display text-3xl font-bold text-text-primary text-center mb-12">
            Key Ingredients & Research
          </h2>
          
          <div className="grid gap-6 max-w-6xl mx-auto md:grid-cols-2">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-text-primary">
                    {ingredient.name}
                  </h3>
                  <span className="text-sm font-medium text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                    {ingredient.category}
                  </span>
                </div>
                <p className="text-text-primary font-medium mb-3">{ingredient.benefit}</p>
                <p className="text-text-secondary text-sm">{ingredient.research}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Information */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-6 text-center">
            Safety & Usage Guidelines
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Safe Usage
              </h3>
              <ul className="space-y-2 text-text-secondary">
                <li>• Take one 50ML bottle as needed</li>
                <li>• Do not exceed one bottle per day</li>
                <li>• Best taken 30-60 minutes before desired effects</li>
                <li>• Can be taken with or without food</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Important Notes
              </h3>
              <ul className="space-y-2 text-text-secondary">
                <li>• Consult your healthcare provider before use</li>
                <li>• Not recommended if pregnant or nursing</li>
                <li>• May interact with certain medications</li>
                <li>• Store in a cool, dry place</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Disclaimer:</strong> These statements have not been evaluated by the FDA. 
              This product is not intended to diagnose, treat, cure, or prevent any disease. 
              Individual results may vary.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}