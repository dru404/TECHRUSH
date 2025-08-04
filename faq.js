function toggleAnswer(questionElement) 
{
  const allQuestions = document.querySelectorAll('.questions');

  allQuestions.forEach
  (
    function(q) 
    {
      if (q !== questionElement) 
      {
        q.classList.remove('active');              
        q.nextElementSibling.style.display = 'none';
      }
    }
  );

  // Toggle active class on clicked question
  questionElement.classList.toggle('active');

  // Show or hide the corresponding answer (next sibling)
  const answer = questionElement.nextElementSibling;
  if (questionElement.classList.contains('active')) 
    answer.style.display = 'block';
  else 
    answer.style.display = 'none';
}
