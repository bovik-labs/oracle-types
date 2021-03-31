(package-initialize)

;; When launched directly from an image, emacs doesn't seem to execute
;; the appropriate shell stuff in .bashrc
(setq shell-file-name "/bin/bash")
(setq exec-path (append exec-path '("/root/.nvm/versions/node/v15.4.0/bin")))

(require 'package)
(setq package-archives
      '(("gnu" . "https://elpa.gnu.org/packages/")
	("melpa" . "https://melpa.org/packages/")))

(custom-set-variables
 '(package-selected-packages (tide)))

(defun setup-tide-mode ()
  (add-hook 'before-save-hook 'tide-format-before-save)
  (setq tide-tsserver-executable "/tapeworm/TypeScript/tsserver.js")
  (setq typescript-indent-level 2)
  (tide-setup)
  (eldoc-mode +1)
  (flycheck-mode +1)
  (setq flycheck-check-syntax-automatically '(save mode-enabled))
  (tide-hl-identifier-mode +1)
  (company-mode +1)
  (setq company-idle-delay nil)
  (define-key tide-mode-map "\C-c\C-r" 'tide-references)
  (define-key tide-mode-map "\C-c\C-s" 'tide-rename-symbol)
  (define-key tide-mode-map (kbd "M-;") 'company-complete)
  ;; aligns annotation to the right hand side
  (setq company-tooltip-align-annotations t)
  (fixup-tide-parse-error))

(add-hook 'typescript-mode-hook #'setup-tide-mode)

(define-key global-map "\C-x;" 'comment-region)

(set-cursor-color "#700")

(defun fixup-tide-parse-error ()
  (defun tide-parse-error (response checker)
	 (-map
     (lambda (diagnostic)
		 (let* ((start (plist-get diagnostic :start))
              (line (plist-get start :line))
              (column (plist-get start :offset))
              (level (if (string= (plist-get diagnostic :category) "suggestion") 'info 'error))
              (text (plist-get diagnostic :text)))
			(when (plist-get diagnostic :relatedInformation)
           (setq text (concat text (propertize " ⮐" 'face 'font-lock-warning-face))))
			(put-text-property 0 1 'diagnostic diagnostic text)
			(flycheck-error-new-at line column level text
                                :checker checker
                                :id (plist-get diagnostic :code))))
     (let ((diagnostic (car (tide-plist-get response :body))))
		 (-concat (plist-get diagnostic :syntaxDiag)
					 (plist-get diagnostic :semanticDiag)
													 ;(plist-get diagnostic :suggestionDiag)
					 )))))
