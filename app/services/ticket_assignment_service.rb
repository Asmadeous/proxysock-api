class TicketAssignmentService
  def initialize(ticket)
    @ticket = ticket
  end
  
  def call
    return if @ticket.assigned_to
    
    # Simple Round Robin
    assign_to_next_agent
  end
  
  private
  
  def assign_to_next_agent
    # Find active support agents
    agents = Employee.support_agents.order(:id)
    return if agents.empty?
    
    # Get last assigned ticket to find next agent
    last_ticket = Ticket.where.not(assigned_to_id: nil).order(created_at: :desc).first
    
    assignee = if last_ticket && last_ticket.assigned_to
                 # Find next agent after last assignee
                 next_idx = agents.index { |a| a.id > last_ticket.assigned_to_id }
                 next_idx ? agents[next_idx] : agents.first
               else
                 agents.first
               end
               
    @ticket.update(assigned_to: assignee)
  end
end
