'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Mail, Sparkles, CheckCircle } from 'lucide-react';
import { professionalEmailTemplates } from '@/lib/professional-email-templates-v2';

export default function EmailTemplatesPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const handlePreview = (template: any) => {
    setSelectedTemplate(template.id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Email Templates</h1>
        <p className="text-gray-600">Choose from our professionally designed email templates with demo data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {professionalEmailTemplates.map((template) => (
          <Card key={template.id} className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  {template.name}
                </CardTitle>
                <Badge variant="secondary">{template.template_type.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Subject Preview:</p>
                <p className="bg-gray-50 p-2 rounded text-xs">{template.subject}</p>
              </div>
              
              <div className="space-y-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        {template.name} - Email Preview
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Subject:</p>
                            <p className="text-gray-600">{template.subject}</p>
                          </div>
                          <div>
                            <p className="font-medium">Template Type:</p>
                            <p className="text-gray-600">{template.template_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="font-medium text-blue-900 mb-2">Demo Data Used:</p>
                        <div className="text-sm text-blue-800 space-y-1">
                          {(() => {
                            const vars = JSON.parse(template.variables);
                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <p>• Restaurant: {vars.restaurant_name}</p>
                                <p>• Customer: {vars.customer_name}</p>
                                <p>• Order #: {vars.order_number}</p>
                                <p>• Total: {vars.total}</p>
                                <p>• Items: {vars.items?.length || 0} items</p>
                                <p>• Type: {vars.order_type}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="border rounded">
                        <div className="bg-gray-100 p-3 border-b">
                          <h4 className="font-medium">HTML Email Preview:</h4>
                        </div>
                        <iframe
                          srcDoc={template.html_content}
                          className="w-full h-96"
                          title={`${template.name} Preview`}
                        />
                      </div>
                      
                      <div className="border rounded">
                        <div className="bg-gray-100 p-3 border-b">
                          <h4 className="font-medium">Plain Text Version:</h4>
                        </div>
                        <div className="p-4 bg-gray-50 font-mono text-sm whitespace-pre-wrap">
                          {template.text_content}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    alert(`Template "${template.name}" would be selected for use. In the actual admin panel, this would copy the template for customization.`);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Professional Email Template Features
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Design Features:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Responsive design for all devices</li>
              <li>• Professional HTML layouts</li>
              <li>• Fallback text versions</li>
              <li>• Cross-email client compatibility</li>
              <li>• Modern, clean styling</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Functionality:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Variable substitution support</li>
              <li>• Order details integration</li>
              <li>• Customer information display</li>
              <li>• Restaurant branding areas</li>
              <li>• Customizable colors and content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
