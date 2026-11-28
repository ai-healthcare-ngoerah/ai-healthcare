/* global jest, describe, beforeEach, test, expect */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SoapFormView from '../SoapFormView';
import { finalizeConsultation } from '../../../services/scribeService';

const mockNavigate = jest.fn();
const mockShowToast = jest.fn();
const mockConfirmAction = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallbackOrOpts) => {
      if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
      if (fallbackOrOpts && typeof fallbackOrOpts.defaultValue === 'string') {
        return fallbackOrOpts.defaultValue;
      }
      return key;
    },
  }),
}));

jest.mock('../../../context/NotificationContext', () => ({
  useNotification: () => ({
    showToast: mockShowToast,
    confirmAction: mockConfirmAction,
  }),
}));

jest.mock('../../../services/scribeService', () => ({
  saveScribeNote: jest.fn(),
  analyzeClinicalScribe: jest.fn(),
  finalizeConsultation: jest.fn().mockResolvedValue({ message: 'Saved' }),
  getTodayQueue: jest.fn().mockResolvedValue([]),
}));

describe('SoapFormView draft name form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('positive: user enters custom draft name and submits it as patient_name', async () => {
    const onPatientChange = jest.fn();

    render(
      <SoapFormView
        soapNote={'S:\nDemam 2 hari\n\nA:\nISPA'}
        transcription="Pasien demam 2 hari"
        onReset={jest.fn()}
        onPatientChange={onPatientChange}
      />
    );

    const input = screen.getByLabelText(/Nama Draf \/ Catatan/i);
    expect(input).toHaveValue('');

    fireEvent.change(input, { target: { value: 'Draf Konsultasi Budi' } });
    expect(input).toHaveValue('Draf Konsultasi Budi');
    expect(onPatientChange).toHaveBeenCalledWith(
      expect.objectContaining({ patientName: 'Draf Konsultasi Budi' })
    );

    const saveBtn = screen.getByRole('button', { name: /scribe\.form\.saveBtn|Simpan/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(finalizeConsultation).toHaveBeenCalledWith(
        expect.objectContaining({ patient_name: 'Draf Konsultasi Budi' })
      );
    });
  });

  test('negative: blank or whitespace draft name safely falls back to Pasien Umum on submit', async () => {
    render(
      <SoapFormView
        soapNote={'S:\nBatuk ringan'}
        transcription="Pasien batuk ringan"
        onReset={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/Nama Draf \/ Catatan/i);
    fireEvent.change(input, { target: { value: '   ' } });

    const saveBtn = screen.getByRole('button', { name: /scribe\.form\.saveBtn|Simpan/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(finalizeConsultation).toHaveBeenCalledWith(
        expect.objectContaining({ patient_name: 'Pasien Umum' })
      );
    });
  });
});
