# frozen_string_literal: true

module Admin
  class UsaEsimImportService
    attr_reader :excel_file, :images, :provider, :stats

    def initialize(excel_file:, images: [], provider: 'lyca')
      @excel_file = excel_file
      @images = Array(images)
      @provider = provider
      @stats = { imported: 0, updated: 0, skipped: 0, image_matched: 0, errors: [] }
    end

    def call
      xlsx = Roo::Spreadsheet.open(excel_file.path, extension: :xlsx)
      sheet = xlsx.sheet(0)

      # Assume headers are on the first row
      headers = sheet.row(1).map(&:to_s).map(&:strip).map(&:upcase)
      
      # Required headers
      iccid_idx = headers.index('ICCID')
      act_idx   = headers.index('ACTIVATION')
      pin1_idx  = headers.index('PIN1')
      puk1_idx  = headers.index('PUK1')
      pin2_idx  = headers.index('PIN2')
      puk2_idx  = headers.index('PUK2')

      if iccid_idx.nil? || act_idx.nil?
        @stats[:errors] << "Missing required headers: ICCID and ACTIVATION are mandatory."
        return @stats
      end

      (2..sheet.last_row).each do |i|
        row = sheet.row(i)
        iccid = row[iccid_idx].to_s.strip
        next if iccid.blank?

        begin
          credential = UsaEsimCredential.find_or_initialize_by(iccid: iccid)
          is_new = credential.new_record?

          credential.assign_attributes(
            qr_activation_code: row[act_idx].to_s.strip,
            pin1: row[pin1_idx],
            puk1: row[puk1_idx],
            pin2: row[pin2_idx],
            puk2: row[puk2_idx],
            provider: provider,
            status: 'available'
          )

          # Match images
          match_and_attach_image(credential, iccid)

          if credential.save
            is_new ? @stats[:imported] += 1 : @stats[:updated] += 1
          else
            @stats[:errors] << "Row #{i} (ICCID #{iccid}): #{credential.errors.full_messages.join(', ')}"
            @stats[:skipped] += 1
          end
        rescue StandardError => e
          @stats[:errors] << "Row #{i} (ICCID #{iccid}): Unexpected error - #{e.message}"
          @stats[:skipped] += 1
        end
      end

      @stats
    end

    private

    def match_and_attach_image(credential, iccid)
      return if images.empty?

      # Find an image where the filename matches the ICCID (e.g., iccidno.png)
      matched_image = images.find do |img|
        filename = img.respond_to?(:original_filename) ? img.original_filename : File.basename(img.path)
        # Check for exact match without extension or inclusion
        filename.downcase.include?(iccid.downcase)
      end

      return unless matched_image

      credential.qr_code_image.attach(matched_image)
      @stats[:image_matched] += 1
    end
  end
end
