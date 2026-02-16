// Accessibility and worksheet save/interaction script
document.addEventListener('DOMContentLoaded', function(){
    // Problem selection keyboard & click handling
    const options = Array.from(document.querySelectorAll('.problem-option'));
    options.forEach(opt => {
        const input = opt.querySelector('input[type="radio"]');
        opt.addEventListener('click', () => {
            input.checked = true;
            options.forEach(o=> o.classList.remove('selected'));
            opt.classList.add('selected');
            options.forEach(o=> o.setAttribute('aria-checked', o===opt));
        });
        opt.addEventListener('keydown', (e)=>{
            if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); opt.click(); }
            if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){
                e.preventDefault(); let i = options.indexOf(opt); let next = options[(i+1) % options.length]; next.focus();
            }
            if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
                e.preventDefault(); let i = options.indexOf(opt); let prev = options[(i-1+options.length) % options.length]; prev.focus();
            }
        });
    });

    // Ratings: act like radio buttons
    const ratingGroups = Array.from(document.querySelectorAll('.rating-circles'));
    ratingGroups.forEach(group => {
        const buttons = Array.from(group.querySelectorAll('.rating-circle'));
        buttons.forEach(btn => {
            btn.addEventListener('click', ()=> setRating(btn, buttons));
            btn.addEventListener('keydown', (e)=>{
                if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setRating(btn, buttons); }
                if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); let idx = buttons.indexOf(btn); buttons[(idx+1)%buttons.length].focus(); }
                if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ e.preventDefault(); let idx = buttons.indexOf(btn); buttons[(idx-1+buttons.length)%buttons.length].focus(); }
            });
        });
    });

    function setRating(selected, group){
        group.forEach(b => { b.setAttribute('aria-checked','false'); b.classList.remove('active'); });
        selected.setAttribute('aria-checked','true');
        selected.classList.add('active');
    }

    // Save worksheet: clone main content and replace interactive controls with their values
    function serializeWorksheet(){
        // Link to external stylesheet so saved snapshot retains styling
        const styleHTML = `<link rel="stylesheet" href="assets/css/styles.css">`;
        const headerHTML = document.querySelector('header').outerHTML;
        const clone = document.getElementById('main-content').cloneNode(true);

        // Replace inputs
        clone.querySelectorAll('input').forEach(i=>{
            const span = document.createElement('span');
            if(i.type === 'checkbox'){
                span.textContent = i.checked ? '☑' : '☐';
                // Append associated label text
                let label = clone.querySelector(`label[for="${i.id}"]`);
                if(!label){
                    const parentLabel = i.closest('label');
                    if(parentLabel) label = parentLabel;
                }
                if(label){ span.textContent += ' ' + label.innerText.trim(); }
                i.replaceWith(span);
            } else if(i.type === 'radio'){
                const opt = i.closest('.problem-option');
                if(opt){
                    if(i.checked){
                        const label = opt.querySelector('label') || opt;
                        const out = document.createElement('div');
                        out.innerHTML = `<strong>Selected:</strong> ${label.innerText.trim()}`;
                        opt.replaceWith(out);
                    }else{
                        // remove unselected
                        if(opt.parentNode) opt.remove();
                    }
                } else {
                    // fallback: replace with value if checked
                    if(i.checked){ span.textContent = i.value; i.replaceWith(span); } else { i.remove(); }
                }
            } else {
                span.textContent = i.value || '—';
                i.replaceWith(span);
            }
        });

        // Replace textareas with preformatted text
        clone.querySelectorAll('textarea').forEach(t=>{
            const pre = document.createElement('pre');
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.padding = '10px';
            pre.style.border = '1px solid #e2e8f0';
            pre.style.borderRadius = '6px';
            pre.textContent = t.value || '';
            t.replaceWith(pre);
        });

        // Replace rating groups
        clone.querySelectorAll('.rating-circles').forEach(group => {
            const sel = group.querySelector('[aria-checked="true"], .active');
            const out = document.createElement('div');
            out.className = 'rating-result muted';
            out.textContent = sel ? `Rating: ${sel.dataset.value}/5` : 'Rating: —';
            group.replaceWith(out);
        });

        // Remove interactive controls that may not be useful in snapshot
        clone.querySelectorAll('button, script').forEach(n=> n.remove());

        // Give a timestamp
        const footer = document.createElement('footer');
        footer.style.marginTop = '28px';
        footer.style.fontSize = '13px';
        footer.style.color = '#475569';
        footer.textContent = 'Saved: ' + new Date().toLocaleString();
        clone.appendChild(footer);

        const serialized = `<!doctype html><html><head><meta charset="utf-8"><title>AI Prompt-a-thon - Filled Worksheet</title>${styleHTML}</head><body>${headerHTML}<main>${clone.innerHTML}</main></body></html>`;
        return serialized;
    }

    function downloadHTML(filename, content){
        const blob = new Blob([content], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    document.getElementById('save-btn').addEventListener('click', ()=>{
        const team = document.getElementById('team-name')?.value || 'worksheet';
        const filename = `${team.replace(/[^a-z0-9-_]/gi,'_')}_worksheet.html`;
        const html = serializeWorksheet();
        downloadHTML(filename, html);
    });

});
