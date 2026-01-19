import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import Tabs, { TabPanel } from '../common/Tabs';
import { 
  DocumentArrowUpIcon,
  ClipboardDocumentIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const ImportContactsModal = ({ 
  isOpen, 
  onClose, 
  onImport, 
  groups = [],
  loading = false 
}) => {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    addTags: []
  });

  const handleClose = () => {
    setError('');
    setSelectedFile(null);
    setCsvText('');
    setSelectedGroup('');
    setActiveTab('file');
    setImportOptions({
      skipDuplicates: true,
      updateExisting: false,
      addTags: []
    });
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleImport = async () => {
    try {
      setError('');
      
      const formData = new FormData();
      
      if (activeTab === 'file') {
        if (!selectedFile) {
          setError('Please select a CSV file');
          return;
        }
        formData.append('file', selectedFile);
      } else {
        if (!csvText.trim()) {
          setError('Please enter CSV data');
          return;
        }
        formData.append('csv_data', csvText);
      }
      
      formData.append('group_id', selectedGroup);
      formData.append('skip_duplicates', importOptions.skipDuplicates);
      formData.append('update_existing', importOptions.updateExisting);
      formData.append('tags', JSON.stringify(importOptions.addTags));
      
      await onImport(formData);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to import contacts');
    }
  };

  const tabs = [
    {
      key: 'file',
      label: 'Upload File',
      icon: <DocumentArrowUpIcon className="w-4 h-4" />
    },
    {
      key: 'paste',
      label: 'Paste Data',
      icon: <ClipboardDocumentIcon className="w-4 h-4" />
    }
  ];

  const csvExample = `name,phone_number,email,tags
John Doe,628123456789,john@example.com,"customer,vip"
Jane Smith,628987654321,jane@example.com,customer
Bob Johnson,628555666777,,prospect`;

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        onClick={handleImport}
        loading={loading}
      >
        Import Contacts
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Contacts"
      size="xl"
      footer={footer}
      closeOnOverlayClick={!loading}
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Import Method Tabs */}
        <Tabs
          tabs={tabs}
          defaultTab="file"
          onChange={setActiveTab}
          variant="pills"
        >
          {/* File Upload */}
          <TabPanel tabKey="file">
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV files only</p>
                </div>
              </div>
              
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>
          </TabPanel>

          {/* Paste Data */}
          <TabPanel tabKey="paste">
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV Data
              </label>
              <textarea
                placeholder="Paste your CSV data here..."
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </TabPanel>
        </Tabs>

        {/* Import Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Import Options</h4>
          
          <div className="space-y-3">
            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Group (Optional)
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duplicate Handling */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="skip-duplicates"
                  type="checkbox"
                  checked={importOptions.skipDuplicates}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    skipDuplicates: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="skip-duplicates" className="ml-2 block text-sm text-gray-900">
                  Skip duplicate phone numbers
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="update-existing"
                  type="checkbox"
                  checked={importOptions.updateExisting}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    updateExisting: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="update-existing" className="ml-2 block text-sm text-gray-900">
                  Update existing contacts
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                CSV Format Requirements
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">Your CSV file should have the following columns:</p>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  <li><strong>name</strong> - Contact name (required)</li>
                  <li><strong>phone_number</strong> - Phone number in international format (required)</li>
                  <li><strong>email</strong> - Email address (optional)</li>
                  <li><strong>tags</strong> - Comma-separated tags in quotes (optional)</li>
                </ul>
                
                <p className="font-medium mb-2">Example:</p>
                <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                  {csvExample}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImportContactsModal;